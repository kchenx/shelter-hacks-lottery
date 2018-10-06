
function createForm() {

  // Create a new form, then add a checkbox question, a multiple choice question,
  // a page break, then a date question and a grid of questions.
  var date = Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy");
  var form = FormApp.create('Harvard Square Shelter ' + date);
  var item = form.addCheckboxItem();
  item.setTitle('What would you like to order?');
  item.setChoices([
    item.createChoice('Full Dinner'),
    item.createChoice('Vegetarian Option'),
    item.createChoice('Grilled Cheese'),
    item.createChoice('Tuna Melt')
  ]);
  
  var item2 = form.addCheckboxItem();
  item2.setTitle('What would you like to order?');
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

/*
  form.addPageBreakItem()
  .setTitle('Getting to know you');
  form.addDateItem()
  .setTitle('When were you born?');
  form.addGridItem()
  .setTitle('Rate your interests')
  .setRows(['Cars', 'Computers', 'Celebrities'])
  .setColumns(['Boring', 'So-so', 'Interesting']);*/