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

  async sendTemporaryPassword(employeeEmail, temporaryPassword) {
    try {
      console.log("Saadan töötajale ajutise parooli aadressile:", employeeEmail);
      const data = await resend.emails.send({
        from: 'NoReply <onboarding@resend.dev>',
        to: employeeEmail,
        subject: 'Ajutine parool teie kontole',
        html: `
                    <h1>Teie konto on loodud</h1>
                    <p>Boss on loonud teile konto. Ajutine parool on:</p>
                    <p><strong>${temporaryPassword}</strong></p>
                    <p>Logige sisse ja muutke parool kohe.</p>
                `
      });
      return data;
    } catch (error) {
      console.error("Viga ajutise parooli meili saatmisel:", error);
      throw error;
    }
  }
};

module.exports = new emailService();