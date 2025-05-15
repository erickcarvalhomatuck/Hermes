<?php
header('Content-type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <?php
    $pages = [
        ['url' => '', 'priority' => '1.0', 'freq' => 'daily'],
        ['url' => 'contato.html', 'priority' => '0.8', 'freq' => 'monthly'],
        ['url' => 'obrigado.html', 'priority' => '0.5', 'freq' => 'yearly'],
        ['url' => 'noticia.html', 'priority' => '0.9', 'freq' => 'daily']
    ];
    
    $categories = ['politica', 'economia', 'tecnologia', 'cultura', 'esportes'];
    
    foreach($pages as $page) {
        echo "<url>
            <loc>https://seusite.com/{$page['url']}</loc>
            <lastmod>".date('Y-m-d')."</lastmod>
            <changefreq>{$page['freq']}</changefreq>
            <priority>{$page['priority']}</priority>
        </url>";
    }
    
    foreach($categories as $cat) {
        echo "<url>
            <loc>https://seusite.com/index.html?categoria=$cat</loc>
            <lastmod>".date('Y-m-d')."</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
        </url>";
    }
    ?>
</urlset>