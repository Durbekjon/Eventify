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

  sendInviteCompany = async (email: string, companyName: string) => {
    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Eventify',
      html: `<body><p>You have been invited to ${companyName}. please check it out!</p></body>`,
    })
  }

  sendInviteToNewUser = async (
    email: string,
    password: string,
    companyName: string,
  ) => {
    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Eventify',
      html: `<><p>You have been invited to ${companyName}. please check it out!</p>
        <p>Your Login: <b>${email}</b></p>
        <p>Your password: <b>${password}</b></p>
      </body>`,
    })
  }
}
