import { diskStorage } from "multer";
import { v4 as uuidv4 } from 'uuid';

export const saveImageToStorage = {
	storage: diskStorage({
		destination: '../uploads',
		filename: (_req, file, callback) => {
			const fileExtension = file.originalname.split('.').pop();
			const fileName = uuidv4() + '.' + fileExtension;
			callback(null, fileName);
		},
	}),
	filter: (_req: Request, file: Express.Multer.File, callback: any) => {
		const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		callback(null, allowedMimeTypes.includes(file.mimetype));
	}
};
