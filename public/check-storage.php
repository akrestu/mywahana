<?php
$link = __DIR__ . '/storage';
$target = realpath(__DIR__ . '/../storage/app/public');

echo "<pre>";
echo "Symlink path : " . $link . "\n";
echo "Symlink exists: " . (file_exists($link) ? 'YES' : 'NO') . "\n";
echo "Is symlink    : " . (is_link($link) ? 'YES' : 'NO') . "\n";
echo "Symlink target: " . (is_link($link) ? readlink($link) : 'N/A') . "\n";
echo "Target exists : " . ($target ? $target : 'NOT FOUND') . "\n";
echo "\nAvatars dir   : " . (is_dir($link . '/avatars') ? 'ACCESSIBLE' : 'NOT ACCESSIBLE') . "\n";

$avatars = glob(__DIR__ . '/storage/avatars/*');
echo "Files via symlink: " . count($avatars) . "\n";
foreach (array_slice($avatars, 0, 3) as $f) {
    echo "  - " . basename($f) . "\n";
}
echo "</pre>";
