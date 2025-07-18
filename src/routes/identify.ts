import express from 'express';
import ContactService from '../services/contactService';
import { IdentifyRequest } from '../types/contact';

const router = express.Router();
const contactService = new ContactService();

router.post('/identify', async (req, res) => {
  try {
    const request: IdentifyRequest = req.body;

    // Validate request
    if (!request.email && !request.phoneNumber) {
      return res.status(400).json({
        error: 'Either email or phoneNumber must be provided'
      });
    }

    const response = await contactService.identifyContact(request);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /identify endpoint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;