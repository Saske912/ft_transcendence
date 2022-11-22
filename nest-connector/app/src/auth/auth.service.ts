import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import * as bcryptjs from 'bcryptjs';
import { Twilio } from "twilio";
import { UsersService } from "users/users.service";

@Injectable()
export class AuthService {
	private twilioClient: Twilio;

	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {
		this.twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
	}

	async validateUser(username: string, pass: string): Promise<any> {
		if (this.usersService.onlineUsers.find(usr => usr.login === username))
			return null;

		const user = await this.usersService.findOneByLogin(username);
		if (user && bcryptjs.compareSync(pass, user.password)) {
			delete user.password;
			return user;
		}
		return null;
	}

	login(user: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		const payload = { id: user.id, username: user.login };

		return { access_token: this.jwtService.sign(payload) };
	}

	async sendSMS(phoneNumber: string) {
		return await this.twilioClient.verify.services(process.env.TWILIO_SERVICE_SID)
			.verifications
			.create({ to: phoneNumber, channel: 'sms' });
	}

	async verifySMS(userId: number, phoneNumber: string, code: string) {

		const user = await this.usersService.findOneById(userId);
		if (!user) throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

		return await this.twilioClient.verify.services(process.env.TWILIO_SERVICE_SID)
			.verificationChecks
			.create({
				to: phoneNumber,
				code: code
			})
			.then(check => {
				if (check.status === "approved") {
					if (!user.phoneNumber)
						return this.usersService.savePhoneNumber(user, phoneNumber);
					return user;
				}
				throw new HttpException('Wrong code', HttpStatus.BAD_REQUEST);
			});
	}
}
