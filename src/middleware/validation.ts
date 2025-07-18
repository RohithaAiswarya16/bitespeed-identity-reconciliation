import { Request, Response, NextFunction } from 'express';
import { IdentifyRequest } from '../types/contact';

export const validateIdentifyRequest = (req: Request, res: Response, next: NextFunction) => {
  const { email, phoneNumber }: IdentifyRequest = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: 'Either email or phoneNumber must be provided'
    });
  }

  if (email && typeof email !== 'string') {
    return res.status(400).json({
      error: 'Email must be a string'
    });
  }

  if (phoneNumber && typeof phoneNumber !== 'string') {
    return res.status(400).json({
      error: 'Phone number must be a string'
    });
  }

  next();
};