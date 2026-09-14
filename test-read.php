<?php
$lockPath = 'C:\Users\T14\Projects\boilerplate-lp\composer.lock';
$lock = json_decode(file_get_contents($lockPath), true);

// Add source to phpstan in packages-dev
foreach ($lock['packages-dev'] as &$pkg) {
    if ($pkg['name'] === 'phpstan/phpstan') {
        echo "Before source: " . json_encode(array_keys($pkg)) . "\n";
        $pkg['source'] = [
            'type' => 'git',
            'url' => 'https://github.com/phpstan/phpstan.git',
            'reference' => $pkg['dist']['reference'],
        ];
        echo "After source: " . json_encode(array_keys($pkg)) . "\n";
        echo "Source ref: " . $pkg['source']['reference'] . "\n";
        break;
    }
}

file_put_contents($lockPath, json_encode($lock, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Lock file saved (no BOM)\n";
