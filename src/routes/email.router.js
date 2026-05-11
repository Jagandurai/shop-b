import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/booking", async (req, res) => {
  try {
    const { firstName, phoneNumber, date, message, serviceName } = req.body;

    if (!firstName || !phoneNumber || !date || !serviceName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const { data, error } = await resend.emails.send({
      from: "Lovely Looks <onboarding@resend.dev>",
      to: ["lovelylooksv@gmail.com"],
      subject: `New Booking Request - ${serviceName}`,
      replyTo: "lovelylooksv@gmail.com",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
          <h2 style="color: #7b1fa2; margin-bottom: 16px;">New Booking Request</h2>
          <p><strong>First Name:</strong> ${firstName}</p>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Service Name:</strong> ${serviceName}</p>
          <p><strong>Message:</strong> ${message || "No message provided"}</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking email sent successfully",
      data,
    });
  } catch (err) {
    console.error("Resend booking email error:", err);

    return res.status(500).json({
      success: false,
      error: "Something went wrong while sending booking email",
    });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const { name, phone, subject, message } = req.body;

    if (!name || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const { data, error } = await resend.emails.send({
      from: "Lovely Looks <onboarding@resend.dev>",
      to: ["lovelylooksv@gmail.com"],
      subject: `Contact Form - ${subject}`,
      replyTo: "lovelylooksv@gmail.com",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
          <h2 style="color: #7b1fa2; margin-bottom: 16px;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact email sent successfully",
      data,
    });
  } catch (err) {
    console.error("Resend contact email error:", err);

    return res.status(500).json({
      success: false,
      error: "Something went wrong while sending contact email",
    });
  }
});

export default router;