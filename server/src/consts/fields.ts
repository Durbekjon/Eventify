export const fieldMapping: Record<string, string[]> = {
  text: ['text1', 'text2', 'text3', 'text4', 'text5'],
  number: ['number1', 'number2', 'number3', 'number4', 'number5'],
  check: ['checkbox1', 'checkbox2', 'checkbox3', 'checkbox4', 'checkbox5'],
  select: ['select1', 'select2', 'select3', 'select4', 'select5'],
  date: ['date1', 'date2', 'date3', 'date4', 'date5'],
  links: ['links'],
  member: ['members'],
  duedate: ['duedate1', 'duedate2', 'duedate3', 'duedate4', 'duedate5'],
  files: ['files'], // Multiple files column also uses the files relationship
}
