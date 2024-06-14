const ExcelJS = require("exceljs");

var fs = require('fs');
var path = require('path')

// function to encode file data to base64 encoded string
export function base64_encode(file: string) {
    console.log('file : ', file)
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

export function generateXLS(data: any, complienceImage: any, attendanceImage: any, project: string, cp: any, ap: any, month: string = '') {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${project}_${month}`, {
      pageSetup: { paperSize: 9, orientation: "landscape" },
      
    });
    // worksheet.views = [{
    //   showGridLines: false
    // }]
    // Initialize the row index
    let rowIndex = 5;
    let InitialRow = worksheet.getRow(1)
    InitialRow.font =  { bold: true };
    InitialRow.getCell('A').value = "Client: " + (project || '');
    InitialRow.getCell('A').alignment = { vertical: 'middle', horizontal: 'center' };
    let headerRow = worksheet.getRow(2)
    headerRow.font =  { bold: true };

    headerRow.getCell('A').value = 'Compliance '+ (cp || '0')  + '%';
    headerRow.getCell('F').value = 'Attendance ' + (ap || '0')  + '%';

    let row = worksheet.getRow(rowIndex);
    row.values = ["EmpId", "EmpNumber", "Username", "Name", "Project", "Manager", "Work Mode", "Work Location", "Commited Days", "Work-In Office", "Work-In Remote", "Compliance %", "Attendance %"];
    row.font = { bold: true };

    const columnWidths = [10, 20, 20, 30, 30, 30, 20, 20, 45, 15, 15, 15, 15];
    worksheet.mergeCells(
      `A1:M1`
    );    
    row.eachCell((cell: any, colNumber: any) => {
        const columnIndex = colNumber - 1;
        const columnWidth = columnWidths[columnIndex];
        worksheet.getColumn(colNumber).width = columnWidth;
      });

      // Loop over the grouped data
      data.forEach((obj: any, index: number) => {
        const row = worksheet.getRow(rowIndex + index + 1);
        row.getCell("A").value = obj.EmpId;
        row.getCell("B").value = obj.EmpNumber;
        row.getCell("C").value = obj.Username;
        row.getCell("D").value = obj.Name;
        row.getCell("E").value = obj?.Project;
        row.getCell("F").value = obj?.Manager;
        row.getCell("G").value = obj?.["Work Mode"];
        row.getCell("H").value = obj?.["Work Location"];
        row.getCell("I").value = obj?.["Commited Days"];
        row.getCell("J").value = obj?.["Present"];
        row.getCell("K").value = obj?.["Absent"];
        row.getCell("L").value = obj?.["Compliance"];
        row.getCell("M").value = obj?.["Attendance"];
        row.getCell("D").alignment = { wrapText: true };
        row.getCell("I").alignment = { wrapText: true };

      });
      // Increment the row index
      rowIndex += data.length;

    // Merge cells for the logo
    // worksheet.mergeCells(
    //   `A1:${String.fromCharCode(65 + worksheet.columns.length - 1)}1`
    // );

    worksheet.mergeCells(
      `A3:${String.fromCharCode(65 + 3)}3`
    );
    worksheet.mergeCells(
      `${String.fromCharCode(65 + 4)}3:${String.fromCharCode(65 + 7)}3`
    );

    const image = workbook.addImage({
      // base64: base64_encode(path.join("public", 'logo.png')), //replace it your image (base 64 in this case)
      base64: complienceImage,
      extension: "png",
    });

    const image2 = workbook.addImage({
      // base64: base64_encode(path.join("public", 'logo.png')), //replace it your image (base 64 in this case)
      base64: attendanceImage,
      extension: "png",
    });

    worksheet.addImage(image, {
      tl: { col: 0, row: 3 },
      ext: { width: 250, height: 350 },
    });
    worksheet.getCell("A5").alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells(
      `A4:D4`
    );
    worksheet.mergeCells(
      `E4:G4`
    );

    worksheet.addImage(image2, {
      tl: { col: 4, row: 3 },
      ext: { width: 250, height: 350 },
    });

    worksheet.getRow(4).height = 350;

    
    // Define the border style
    const borderStyle = {
      style: "thin", // You can use 'thin', 'medium', 'thick', or other valid styles
      color: { argb: "00000000" },
    };

    // Loop through all cells and apply the border style
    worksheet.eachRow((row: any, rowNumber: any) => {
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        cell.border = {
          top: borderStyle,
          bottom: borderStyle,
        };
      });
    });

    // Generate the XLS file
    return workbook.xlsx.writeBuffer();
  } catch (err) {
    console.log(err);
  }
}