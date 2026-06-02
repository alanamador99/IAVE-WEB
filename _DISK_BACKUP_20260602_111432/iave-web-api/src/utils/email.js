import { createTransport } from 'nodemailer';

var transporter = createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "api",
    pass: "4315814f3aebb8eb69d1ca9f87497098"
  }
});

const enviarCorreoAbuso = async ({ operador, tag, caseta, fecha, tipo, importe }) => {
  try {
    const mailOptions = {
      from: `"Sistema de Abusos" <${process.env.EMAIL_USER}>`,
      to: 'alanamadors96@gmail.com', // o separados por coma
      subject: `Cruce indebido del operador ${operador}`,
      html: `
        <p><strong>TAG:</strong> ${tag}</p>
        <p><strong>Operador:</strong> ${operador}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Caseta:</strong> ${caseta}</p>
        <p><strong>Tipo de abuso:</strong> ${tipo}</p>
        <p><strong>Importe:</strong> $${importe}</p>
        <p>Favor de aplicar el descuento correspondiente y levantar el acta administrativa.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado a Nómina y Personal');
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
};

export default enviarCorreoAbuso ;
