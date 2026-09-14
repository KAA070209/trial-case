<?php
$path = __DIR__ . '/vendor/composer/tmp-test-write.zip';
$data = str_repeat('A', 1024*1024);
$ok = file_put_contents($path, $data);
if ($ok) {
    echo "WRITE OK: $ok bytes\n";
    unlink($path);
    echo "Cleanup OK\n";
} else {
    echo "WRITE FAILED\n";
    print_r(error_get_last());
}
