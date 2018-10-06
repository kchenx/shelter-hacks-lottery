/**
 * A special function that inserts a custom menu when the spreadsheet opens.
 */
function onOpen() {
  var menu = [{name: 'Set up', functionName: 'setUp_'}];
  SpreadsheetApp.getActive().addMenu('Conference', menu);
}

/**
 * A set-up function that uses the conference data in the spreadsheet to create
 * Google Calendar events, a Google Form, and a trigger that allows the script
 * to react to form responses.
 */
function setUp_() {
  if (ScriptProperties.getProperty('calId')) {
    Browser.msgBox('Your form is already set sent. Look in Google Drive!');
  }
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Conference Setup');
  var range = sheet.getDataRange();
  var values = range.getValues();
  //setUpCalendar_(values, range);
  setUpForm_(ss, values);
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit()
      .create();
  ss.removeMenu('Conference');
}


function joinDateAndTime_(date, time) {
  date = new Date(date);
  date.setHours(time.getHours());
  date.setMinutes(time.getMinutes());
  return date;
}

/**
 * Creates a Google Form that allows respondents to select which conference
 * sessions they would like to attend, grouped by date and start time.
 *
 * @param {Spreadsheet} ss The spreadsheet that contains the conference data.
 * @param {Array<String[]>} values Cell values for the spreadsheet range.
 */
/*function setUpForm_(ss, values) {
  // Group the sessions by date and time so that they can be passed to the form.
  var schedule = {};
  for (var i = 1; i < values.length; i++) {
    var session = values[i];
    var day = session[1].toLocaleDateString();
    var time = session[2].toLocaleTimeString();
    if (!schedule[day]) {
      schedule[day] = {};
    }
    if (!schedule[day][time]) {
      schedule[day][time] = [];
    }
    schedule[day][time].push(session[0]);
  }

  // Create the form and add a multiple-choice question for each timeslot.
  var form = FormApp.create('Conference Form');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  form.addTextItem().setTitle('Name').setRequired(true);
  form.addTextItem().setTitle('Email').setRequired(true);
  for (var day in schedule) {
    var header = form.addSectionHeaderItem().setTitle('Sessions for ' + day);
    for (var time in schedule[day]) {
      var item = form.addMultipleChoiceItem().setTitle(time + ' ' + day)
          .setChoiceValues(schedule[day][time]);
    }
  }
}*/

function createTimeDrivenTriggers() {
  // Trigger create form function every day at 09:00.
  ScriptApp.newTrigger('createForm')
      .timeBased()
      .atHour(9)
      .create();
}

function setUpForm_(ss, values) {
  var date = Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy");
  var form = FormApp.create('Harvard Square Shelter Dinner ' + date);
  var item = form.addCheckboxItem();
  item.setTitle('What meal would you like to order?');
  item.setChoices([
    item.createChoice('Full Dinner'),
    item.createChoice('Vegetarian Option'),
    item.createChoice('Grilled Cheese'),
    item.createChoice('Tuna Melt')
  ]);
  
  var item2 = form.addCheckboxItem();
  item2.setTitle('What drink would you like to order?');
  item2.setChoices([
    item2.createChoice('Coffee'),
    item2.createChoice('Tea'),
    item2.createChoice('Juice')
  ]);
  
  form.addMultipleChoiceItem()
  .setTitle('Do you have any dietary restrictions?')
  .setChoiceValues(['Gluten-free','Vegetarian', "Vegan"])
  .showOtherOption(true);
  
  form.addTextItem()
  .setTitle('First Name')
  
  form.addTextItem()
  .setTitle('Last Name')
  
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
}

/**
 * A trigger-driven function that sends out calendar invitations and a
 * personalized Google Docs itinerary after a user responds to the form.
 *
 * @param {Object} e The event parameter for form submission to a spreadsheet;
 *     see https://developers.google.com/apps-script/understanding_events
 */
function onFormSubmit(e) {
  var user = {name: e.namedValues['Name'][0], email: e.namedValues['Email'][0]};

  // Grab the session data again so that we can match it to the user's choices.
  var response = [];
  var date = Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy");
  var values = SpreadsheetApp.getActive().getSheetByName('Harvard Square Shelter Dinner ' + date)
     .getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var session = values[i];
    var title = session[0];
    var day = session[1].toLocaleDateString();
    var time = session[2].toLocaleTimeString();
    var timeslot = time + ' ' + day;

    // For every selection in the response, find the matching timeslot and title
    // in the spreadsheet and add the session data to the response array.
    if (e.namedValues[timeslot] && e.namedValues[timeslot] == title) {
      response.push(session);
    }
  }
  //sendInvites_(user, response);
  sendDoc_(user, response);
}

/**
 * Add the user as a guest for every session he or she selected.
 * @param {object} user An object that contains the user's name and email.
 * @param {Array<String[]>} response An array of data for the user's session choices.
 */
/*function sendInvites_(user, response) {
  var id = ScriptProperties.getProperty('calId');
  var cal = CalendarApp.getCalendarById(id);
  for (var i = 0; i < response.length; i++) {
    cal.getEventSeriesById(response[i][5]).addGuest(user.email);
  }
}*/

/**
 * Create and share a personalized Google Doc that shows the user's itinerary.
 * @param {object} user An object that contains the user's name and email.
 * @param {Array<string[]>} response An array of data for the user's session choices.
 */
function sendDoc_(user, response) {
  var doc = DocumentApp.create('Itinerary for ' + user.name)
      .addEditor(user.email);
  var body = doc.getBody();
  var table = [['Session', 'Date', 'Time', 'Location']];
  for (var i = 0; i < response.length; i++) {
    table.push([response[i][0], response[i][1].toLocaleDateString(),
        response[i][2].toLocaleTimeString(), response[i][4]]);
  }
  body.insertParagraph(0, doc.getName())
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  table = body.appendTable(table);
  table.getRow(0).editAsText().setBold(true);
  doc.saveAndClose();

  // Email a link to the Doc as well as a PDF copy.
  MailApp.sendEmail({
    to: user.email,
    subject: doc.getName(),
    body: 'Thanks for registering! Here\'s your itinerary: ' + doc.getUrl(),
    attachments: doc.getAs(MimeType.PDF)
  });
}