import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "auth/auth.service";
import { Strategy } from "passport-local";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {

	constructor(private authService: AuthService) {
		super();
	}

	async validate(username: string, password: string): Promise<any> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const user = await this.authService.validateUser(username, password);
		if (!user)
			throw new UnauthorizedException();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return user;
	}

}
