<?php
$dir = __DIR__ . '/vendor/composer';
if (!is_dir($dir)) mkdir($dir, 0777, true);
$path = $dir . '/tmp-test-curl.zip';
$url = 'https://codeload.github.com/phpstan/phpstan/legacy.zip/174b0d88710f00a42598886504dd7a146f91ace5';

echo "Testing fopen + curl to $path...\n";

$fp = @fopen($path, 'w');
if (!$fp) {
    echo "fopen FAILED: " . print_r(error_get_last(), true);
    exit(1);
}
echo "fopen OK\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Composer/2.10');
curl_setopt($ch, CURLOPT_SSL_VERIFYSTATUS, false);
$result = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
$errno = curl_errno($ch);
curl_close($ch);
fclose($fp);

if ($result) {
    $size = filesize($path);
    echo "SUCCESS: $size bytes downloaded (HTTP $code)\n";
    unlink($path);
} else {
    echo "FAILED: curl_errno=$errno err=$err HTTP=$code\n";
    if (file_exists($path)) {
        echo "File size: " . filesize($path) . " bytes\n";
    }
}
