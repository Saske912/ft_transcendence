import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from 'app.controller';
import { AppService } from 'app.service';
import { AuthModule } from 'auth/auth.module';
import { BanListsEntity } from "ban-lists/ban-lists.entity";
import { BanListsModule } from 'ban-lists/ban-lists.module';
import { ChannelModule } from 'channel/channel.module';
import { ChannelEntity } from "channel/entities/channel.entity";
import { ChannelMemberEntity } from "channel/entities/channelMember.entity";
import { ChatEntity } from "chat/chat.entity";
import { ChatModule } from 'chat/chat.module';
import { GameEntity } from "game/game.entity";
import { GameModule } from 'game/game.module';
import { ImagesModule } from 'images/images.module';
import { LadderModule } from 'ladder/ladder.module';
import { MessageEntity } from "message/message.entity";
import { MessageModule } from 'message/message.module';
import { TwilioModule } from "nestjs-twilio";
import { UserSubscription } from "users/entities/subscription.entity";
import { User } from 'users/entities/user.entity';
import { UsersModule } from 'users/users.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST,
			port: 5432,
			username: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			entities: [User, GameEntity, UserSubscription, ChatEntity, MessageEntity, ChannelEntity, ChannelMemberEntity, BanListsEntity],
			retryAttempts: 50,
			retryDelay: 5000
		}),
		TwilioModule.forRoot({
			accountSid: process.env.TWILIO_ACCOUNT_SID,
			authToken: process.env.TWILIO_AUTH_TOKEN,
		}),
		UsersModule,
		LadderModule,
		GameModule,
		EventEmitterModule.forRoot(),
		ChatModule,
		MessageModule,
		AuthModule,
		ChannelModule,
		BanListsModule,
		ImagesModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
