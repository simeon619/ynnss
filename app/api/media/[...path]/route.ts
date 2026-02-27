import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
	region: process.env.AWS_REGION || "garage",
	endpoint: process.env.AWS_ENDPOINT || "http://127.0.0.1:3900",
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
	const path = (await params).path.join("/");
	const bucketName = process.env.AWS_BUCKET_NAME || "delivery";

	try {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: path,
		});

		const response = await s3Client.send(command);

		if (!response.Body) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Convert readable stream to response body
		const stream = response.Body as ReadableStream;

		return new NextResponse(stream, {
			headers: {
				"Content-Type": response.ContentType || "application/octet-stream",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error: unknown) {
		console.error("Media Proxy Error:", error);
		return new NextResponse("Not Found", { status: 404 });
	}
}
