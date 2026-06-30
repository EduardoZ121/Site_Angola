# Provisiona S3 + IAM para Kuteka (fotos de anuncios)
$ErrorActionPreference = "Stop"
$Region = "eu-west-1"
$Bucket = "kuteka-uploads-prod"
$UserName = "kuteka-s3-uploader"
$PolicyName = "KutekaS3UploadPolicy"
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root ".env"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Verificar credenciais AWS"
$identity = aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "Conta: $($identity.Account) | ARN: $($identity.Arn)"

Write-Step "Criar bucket s3://$Bucket"
$bucketExists = $true
try {
  aws s3api head-bucket --bucket $Bucket 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { $bucketExists = $false }
} catch {
  $bucketExists = $false
}
if (-not $bucketExists) {
  aws s3api create-bucket --bucket $Bucket --region $Region --create-bucket-configuration LocationConstraint=$Region
  if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: conta AWS sem S3 activo. Abra https://s3.console.aws.amazon.com/s3/home?region=eu-west-1 e clique Get started / Create bucket uma vez."
    exit 1
  }
  Write-Host "Bucket criado."
} else {
  Write-Host "Bucket ja existe."
}

Write-Step "Bloquear acesso publico directo"
aws s3api put-public-access-block --bucket $Bucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

Write-Step "Configurar CORS"
$corsFile = Join-Path $env:TEMP "kuteka-cors.json"
@'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": [
        "https://kutekalink.com",
        "https://www.kutekalink.com",
        "http://localhost:5173"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
'@ | Out-File -FilePath $corsFile -Encoding ascii
aws s3api put-bucket-cors --bucket $Bucket --cors-configuration file://$corsFile

Write-Step "Politica IAM"
$policyFile = Join-Path $env:TEMP "kuteka-policy.json"
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::$Bucket/listings/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::$Bucket",
      "Condition": { "StringLike": { "s3:prefix": ["listings/*"] } }
    }
  ]
}
"@ | Out-File -FilePath $policyFile -Encoding ascii
$policyArn = "arn:aws:iam::$($identity.Account):policy/$PolicyName"
aws iam create-policy --policy-name $PolicyName --policy-document file://$policyFile 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Politica existente - reutilizar $policyArn"
}

Write-Step "Utilizador IAM $UserName"
aws iam create-user --user-name $UserName 2>$null | Out-Null
aws iam attach-user-policy --user-name $UserName --policy-arn $policyArn 2>$null | Out-Null

Write-Step "Chaves de acesso"
$keyJson = aws iam create-access-key --user-name $UserName --output json | ConvertFrom-Json
$accessKey = $keyJson.AccessKey.AccessKeyId
$secretKey = $keyJson.AccessKey.SecretAccessKey

Write-Step "Actualizar .env"
if (-not (Test-Path $EnvFile)) { Copy-Item (Join-Path $Root ".env.example") $EnvFile }
$content = Get-Content $EnvFile -Raw
$content = $content -replace 'AWS_REGION=.*', "AWS_REGION=$Region"
$content = $content -replace 'AWS_S3_BUCKET=.*', "AWS_S3_BUCKET=$Bucket"
$content = $content -replace 'AWS_ACCESS_KEY_ID=.*', "AWS_ACCESS_KEY_ID=$accessKey"
$content = $content -replace 'AWS_SECRET_ACCESS_KEY=.*', "AWS_SECRET_ACCESS_KEY=$secretKey"
Set-Content -Path $EnvFile -Value $content -NoNewline

Write-Host ""
Write-Host "[OK] AWS S3 configurado para Kuteka" -ForegroundColor Green
Write-Host "  Bucket: $Bucket"
Write-Host "  Region: $Region"
Write-Host "  IAM user: $UserName"
