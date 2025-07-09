import { OTP_VALID_DURATION_MINUTES } from '@consts/token'
import { Injectable } from '@nestjs/common'
import { createTransport } from 'nodemailer'

@Injectable()
export class EmailService {
  private transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  sendRegistrationOtp = async (email: string, otp: string) => {
    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Eventify',
      html: `<body><p>Your OTP: <b>${otp}</b></p><p>It expires in ${OTP_VALID_DURATION_MINUTES} minutes.</p></body>`,
    })
  } //

  sendRestoreAccountOtp = async (email: string, otp: string) => {
    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Eventify',
      html: `<body><p>Your OTP: <b>${otp}</b></p><p>It expires in ${OTP_VALID_DURATION_MINUTES} minutes.</p></body>`,
    })
  }
}
