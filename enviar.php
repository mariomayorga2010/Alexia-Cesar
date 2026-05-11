<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Recogida y limpieza de datos
    $nombre = strip_tags(trim($_POST["name"]));
    $dieta  = strip_tags(trim($_POST["diet"]));
    
    // 2. Configuración del destinatario
    $destinatario = "mariomayorga2010@icloud.com";
    $asunto = "Acepto ir a tu boda";
    
    // 3. Construcción del mensaje emotivo
    $cuerpo = "¡Hola Alexia y César!\n\n";
    $cuerpo .= "Tenemos noticias maravillosas. Alguien muy especial ha confirmado que los acompañará en el inicio de esta nueva aventura.\n\n";
    $cuerpo .= "Detalles de la confirmación:\n";
    $cuerpo .= "--------------------------------------------------\n";
    $cuerpo .= "Invitado: " . $nombre . "\n";
    $cuerpo .= "Notas/Dieta: " . ($dieta ? $dieta : "Sin restricciones específicas") . "\n";
    $cuerpo .= "--------------------------------------------------\n\n";
    $cuerpo .= "¡Qué alegría que su gran día esté rodeado de tanto cariño!\n";
    $cuerpo .= "Este es un mensaje automático de tu sistema de invitación web.";

    // 4. Encabezados de correo
    $headers = "From: Invitacion Boda <no-reply@tudominio.com>\r\n";
    $headers .= "Reply-To: " . $destinatario . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // 5. Envío y Redirección
    if (mail($destinatario, $asunto, $cuerpo, $headers)) {
        // Redirigir a una página de éxito o volver con un parámetro
        header("Location: index.html?status=success#rsvp");
    } else {
        echo "Lo sentimos, hubo un error al enviar tu confirmación. Por favor intenta más tarde.";
    }
} else {
    header("Location: index.html");
}
?>