import * as EditUser from "api/editUser";

export type ImageState = {
	type: 'generated' | 'uploaded';
	image: string | ArrayBuffer | null;
	file: File | null;
};

export const updateAvatar = async (imageState: ImageState) => {
	if (imageState.type === 'generated') {
		return EditUser.updateAvatar({urlAvatar: imageState.image});
	}

	if (imageState.type === 'uploaded') {
		if (!imageState.file) return;

		const formData = new FormData();
		formData.append('picture', imageState.file);

		return EditUser.uploadAvatar(formData);
	}

	throw new Error('Unhandled');
};
