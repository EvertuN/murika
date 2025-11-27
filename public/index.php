<?php
require_once "../env.php";
$url = isset($_GET['url']) ? $_GET['url'] : '';
$url = trim($url, '/');

// Bloquei de caracters suspeitos
if (preg_match('/[^a-zA-Z0-9\-_\/]/', $url) || strpos($url, '..') !== false) {
    header('Location: /');
    exit;
}

// Lista de rotas permitidas
$rotasPermitidas = ['', 'login'];

if (!in_array($url, $rotasPermitidas)) {
    header('Location: /');
    exit;
}

// Roteamento
switch ($url) {
    case '':
    case 'home':
        require_once "../src/config/database.php";
        require_once "../src/view/home/home.php";
        break;
    case 'login':
        require_once "../src/view/login/login.php";
        break;
}