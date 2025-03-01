import notificationRepository from "./notifications.js";
import deviceRepository from "./devices.js";
import firebaseProvider from "./providers/firebase.js";
import telegramProvider from "./providers/telegram.js";
import scheduleNotificationParser from "./parser.js";




const process = async (env) => {
	const [notifications, fields] = await notificationRepository.getNotifications(env);
	const notificationsThatShouldBeSent = notifications?.filter((notification) => {
			return shouldSendNofication(notification);
	});
	console.log('notificationsThatShouldBeSent', notificationsThatShouldBeSent);

	for (const notification of notificationsThatShouldBeSent) {
			const userId = notification.userId;
			if (notification.provider === 'firebase') {
					const [devices] = await deviceRepository.getDevices(env, userId);
					for (const device of devices) {
							await sendNotification(env, notification, device.fdcToken);
					}
					await notificationRepository.updateSentAt(env, notification.notificationId);
					await notificationRepository.createUserNotification(env, [userId, notification.notificationId]);
					continue;
			}
			await sendNotification(env, notification, '');
			await notificationRepository.updateSentAt(env, notification.notificationId);
			await notificationRepository.createUserNotification(env, [userId, notification.notificationId]);
	}
	return new Response('Notifications processed', { status: 200 });
}


const shouldSendNofication = (notification) => {
	const schedule = scheduleNotificationParser.parse(notification.schedule);
	const now = getActualDate();
	const day = now.getDay();
	const hour = now.getHours();
	const month = now.getMonth()+1;
	const minute = now.getMinutes();
	const monthDay = now.getDate();

	if (schedule.everyMinutes) {
			const minuteSentAt = notification.sentAt?.getMinutes() || 0;
			console.log('minuteSentAt', minuteSentAt);
			return Math.abs(minute - minuteSentAt) >= schedule.everyMinutes;
	}
	if (schedule.everyHours) {
			const hourSentAt = notification.sentAt?.getHours() || 0;
			return Math.abs(hour - hourSentAt) >= schedule.everyHours;
	}
	if (schedule.everyDays) {
			const daySentAt = notification.sentAt?.getDate() || 0;
			return minute == schedule.atTime.minute && hour == schedule.atTime.hour && Math.abs(monthDay - daySentAt) >= schedule.everyDays;
	}
	if (schedule.everyWeeks) {
			const weekNumberSentAt = Math.ceil(notification.sentAt?.getDate() / 7);
			const weekNumber = Math.ceil(monthDay / 7);
			return minute == schedule.atTime.minute && hour == schedule.atTime.hour && day == getDayOfWeek(schedule.onDayOfWeek) && Math.abs(weekNumber - weekNumberSentAt) >= schedule.everyWeeks;
	}
	if (schedule.everyMonths) {
			const sentAtMonth = (notification.sentAt?.getMonth() || -1) + 1;

			if (schedule.onEach){
					return monthDay == schedule?.onEach.day && hour == schedule.atTime.hour && minute == schedule.atTime.minute && Math.abs(month - sentAtMonth) >= schedule.everyMonths;
			}
			const dayOfWeek = getDayOfWeek(schedule.onThe.day);
			const position = getPosition(schedule.onThe.position);

			const weekNumber = Math.ceil(monthDay / 7);
			const isInDesiredWeek = weekNumber === position;

			if (day === dayOfWeek && isInDesiredWeek){
					return minute == schedule.atTime.minute && hour == schedule.atTime.hour && Math.abs(month - sentAtMonth) >= schedule.everyMonths;
			}
	} else {
			throw new Error('Invalid schedule');
	}
}

function getActualDate() {
	return new Date();
}

function getPosition(position) {
	switch (position) {
			case 'first':
					return 1;
			case 'second':
					return 2;
			case 'third':
					return 3;
			case 'fourth':
					return 4;
			case 'fifth':
					return 5;
			case 'last':
					return 6;
			default:
					throw new Error('Invalid position');
	}
}

function getDayOfWeek(day) {
	switch (day) {
			case 'Mon':
					return 1;
			case 'Tue':
					return 2;
			case 'Wed':
					return 3;
			case 'Thu':
					return 4;
			case 'Fri':
					return 5;
			case 'Sat':
					return 6;
			case 'Sun':
					return 7;
			default:
					throw new Error('Invalid day of week');
	}
}

const sendNotification = async (env, notification, fdcToken) => {
	switch (notification.provider) {
			case 'firebase':
					return await firebaseProvider.sendPushNotification(env, notification, fdcToken);
			case 'telegram':
					return await telegramProvider.sendTelegramNotification(env, notification);
	}
}

const notificationsProcessor = {
	process,
};

export default notificationsProcessor;
