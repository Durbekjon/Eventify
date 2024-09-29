import * as bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common'
import { PASSWORD_SALT } from '@consts/password-salt'
import { OTP_VALID_DURATION_MINUTES } from '@consts/token'

@Injectable()
export class UtilsService {
  generateBcrypt = async (password: string) => {
    return bcrypt.hash(password, PASSWORD_SALT)
  }

  compareHash = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compareSync(password, hash)
  }

  getMonths(date: Date): { currentMonth: Date; nextMonth: Date } {
    const inputDate = new Date(date)

    const currentMonth = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      1,
    )

    const nextMonth = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth() + 1,
      1,
    )

    return { currentMonth, nextMonth }
  }

  multipleByOneHundred(num: number) {
    return num * 100
  }

  divideToOneHundred(num: number) {
    return num / 100
  }

  generateOtp(): string {
    let otp = ''
    for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 100) % 10
    }
    return otp
  }

  isOtpExpired(createdAt: Date): boolean {
    return (
      (new Date().getTime() - createdAt.getTime()) / (60 * 1000) >
      OTP_VALID_DURATION_MINUTES
    )
  }
}
