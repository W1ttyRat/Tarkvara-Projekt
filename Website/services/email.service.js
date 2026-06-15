const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = new Resend(RESEND_API_KEY);

class emailService {
    async sendBookingConfirmation(clientEmail, bookingDetails) {
        try {
    console.log("Saadan broneeringu kinnitust meili aadressile:", clientEmail);
    const data = await resend.emails.send({
      from: 'Broneeringud <onboarding@resend.dev>', // Tasuta paketis peab jääma onboarding@resend.dev
      to: clientEmail,
      subject: 'Broneeringu kinnitus',
      html: `
        <h1>Sinu broneering on kinnitatud!</h1>
        <p>Aitäh, et broneerisid. Siin on sinu andmed:</p> 
        <ul>  
          <li><strong>Nimi:</strong> ${bookingDetails.name}</li>
          <li><strong>Registreerimisnumber:</strong> ${bookingDetails.registration_number}</li>
          <li><strong>Asukoht:</strong> ${bookingDetails.location}</li>
          <li><strong>Teenus:</strong> ${bookingDetails.service}</li>
          <li><strong>Algusaeg:</strong> ${bookingDetails.start_time}</li>
        </ul>
        <p>Kohtumiseni!</p>
      `
    });
    return data;
    } catch (error) {
      console.error("Viga meili saatmisel:", error);
    throw error;
    }
  }
};

module.exports = new emailService();