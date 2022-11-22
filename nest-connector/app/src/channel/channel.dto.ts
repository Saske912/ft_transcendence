import {
	IsBoolean, IsIn,
	IsNumber, IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateIf
} from "class-validator";

export class CreateChannelDTO {
	@MinLength(4)
	@MaxLength(16)
	@IsString()
	name: string;

	@IsString()
	title: string;

	@IsBoolean()
	isPrivate: boolean;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
	@ValidateIf(o => o.isPrivate)
	@IsString()
	@MinLength(6)
	password: string;
}

export class JoinChannelDTO {
	@IsNumber()
	channelId: number;

	@IsOptional()
	@IsString()
	password: string;
}

export class UpdateMemberStatusDTO {
	@IsNumber()
	channelId: number;

	@IsNumber()
	memberId: number;

	@IsString()
	@IsIn(['member', 'admin'])
	status: string;
}

export class MuteMemberDTO {
	@IsNumber()
	channelId: number;

	@IsNumber()
	memberId: number;

	@IsString()
	@IsOptional()
	unbanDate: string | null;
}

export class UnmuteMemberDTO {
	@IsNumber()
	channelId: number;

	@IsNumber()
	memberId: number;
}

export class UpdateChannelDTO {
	@IsNumber()
	channelId: number;

	@IsBoolean()
	isPrivate: boolean;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
	@ValidateIf(o => o.isPrivate)
	@IsString()
	@MinLength(6)
	password: string;
}

export class LeaveChannelDTO {
	@IsNumber()
	channelId: number;
}
