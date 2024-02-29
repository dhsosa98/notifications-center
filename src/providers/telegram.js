// import config from "../config.js";

// const telegramConfig = config;

const sendTelegramNotification = async (telegramConfig, notification) => {
	const { title, body } = notification;
	if (!title || !body) {
		throw new Error("Invalid notification");
	}
	const message = `${title} ${body}`;
	try {
			const response = await fetch(
				`${telegramConfig.TELEGRAM_API}/bot${telegramConfig.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${telegramConfig.TELEGRAM_CHAT_ID}&text=${message}`,
				{
					method: "POST",
				}
			)
			console.log("Notification sent successfully");
			// console.log(response);
		} catch (e) {
			console.log(e);
		}
}

const telegramProvider = {
	sendTelegramNotification,
};

export default telegramProvider;
