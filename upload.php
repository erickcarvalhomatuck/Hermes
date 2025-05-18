<?php
header('Content-Type: application/json');

// Configurações (ajuste conforme necessário)
$uploadDir = 'uploads/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Cria diretório se não existir
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Verifica se houve upload
if (empty($_FILES['file'])) {
    echo json_encode(['error' => 'Nenhum arquivo enviado.']);
    exit;
}

$file = $_FILES['file'];

// Verifica erros
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Erro no upload: ' . $file['error']]);
    exit;
}

// Verifica tipo do arquivo
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['error' => 'Tipo de arquivo não permitido.']);
    exit;
}

// Verifica tamanho
if ($file['size'] > $maxSize) {
    echo json_encode(['error' => 'Arquivo muito grande. Máximo: 5MB.']);
    exit;
}

// Gera nome único
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '.' . $extension;
$destination = $uploadDir . $filename;

// Move o arquivo
if (move_uploaded_file($file['tmp_name'], $destination)) {
    echo json_encode(['location' => $destination]);
} else {
    echo json_encode(['error' => 'Falha ao mover arquivo.']);
}
?>