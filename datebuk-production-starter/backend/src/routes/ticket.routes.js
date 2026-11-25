const router = require('express').Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const prisma = require('../utils/prisma');
const upload = multer({ dest: 'backend/uploads/' });

async function sendTicketEmail(ticket) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: `${ticket.email},${process.env.SUPPORT_EMAIL}`,
    subject: `DateBuk Support Ticket: ${ticket.issueType}`,
    text: `Ticket received from ${ticket.name}\nEmail: ${ticket.email}\nIssue: ${ticket.issueType}\n\n${ticket.message}`
  });
}

router.post('/', upload.single('attachment'), async (req, res) => {
  const { name, email, issueType, message } = req.body;
  if (!name || !email || !issueType || !message) return res.status(400).json({ error: 'All fields are required' });
  const ticket = await prisma.ticket.create({ data: { name, email, issueType, message, attachmentUrl: req.file ? `/uploads/${req.file.filename}` : null } });
  await sendTicketEmail(ticket);
  res.status(201).json({ message: 'Ticket submitted successfully', ticket });
});
module.exports = router;
