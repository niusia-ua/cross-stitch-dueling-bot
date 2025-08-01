-club = ДК "Дуельний клуб"

## Common labels.

menu-button-label = Відкрити

## Bot commands.

-cmd-start = /start
command-start = Запустити бота

-cmd-about = /about
command-about = Про бота

-cmd-help = /help
command-help = Довідка бота

## Bot messages.

private-message-welcome =
  Вітаємо у { -club }!
  Будь ласка, перегляньте правила і довідку. { -cmd-help }

  Щоб розпочати, запустіть вебзастосунок, натиснувши на кнопку <i>{ menu-button-label }</i> поруч із рядком вводу.
group-message-welcome =
  Вітаю! Я – бот для проведення дуелей у { -club }.
  Будь ласка, перегляньте правила і довідку. { -cmd-help }

message-about =
  <b>Репозиторій:</b> https://github.com/niusia-ua/cross-stitch-dueling-bot
  <b>Розробник:</b> Назар Антонюк, @niusia_ua, antoniuk.nazar09@gmail.com

message-help =
  <b>Довідка бота:</b>
  - <a href="https://telegra.ph/Pravila-Duelnogo-klubu-05-02">Правила { -club }</a>.
  - <a href="https://telegra.ph/Pos%D1%96bnik-po-botu-Duelnogo-klubu-05-03">Посібник по боту</a>.

## Duel messages.

message-duel-requested =
  { $user } викликав/ла вас на дуель!
  Перейдіть на сторінку <i>Повідомлення</i> у вебзастосунку, щоб прийняти або відхилити виклик.
message-duel-request-accepted = { $user } прийняв/ла виклик на дуель!
message-duel-request-declined = { $user } відхилив/ла виклик на дуель!
message-duel-request-expired = Час дійсності виклику на дуель від { $fromUser } до { $toUser } минув.

message-duel-announcement =
  Оголошено дуель між { $user1 } та { $user2 }!
  Кодове слово: <b>{ $codeword }</b>.
  Дедлайн: <b>{ $deadline }</b>.

## Error messages.

message-error-unknown =
  Вибачте, сталася помилка.
  Будь ласка, спробуйте ще раз.

message-error-not-target-chat = Я не призначений для цієї групи! 👻
