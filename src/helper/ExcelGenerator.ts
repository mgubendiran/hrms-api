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

export function generateXLS(data: any) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("project_report", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Initialize the row index
    let rowIndex = 2;

    // EmpId: d.EmployeeId,
    // EmpNumber: d.Number,
    // Username: d.UserName,
    // Name: `${d.FirstName} ${d.LastName}`,
    // "WorkLocation" : d.WorkLocation,
    // "Commited Days": commitedDays.join(', '),
    // Present: present,
    // Absent: d.absent + (d.half / 2),
    // Compliance: compliance

    let row = worksheet.getRow(rowIndex);
    row.values = ["EmpId", "EmpNumber", "Username", "Name", "Project", "Manager", "Work Mode", "Work Location", "Commited Days", "Present", "Absent", "Compliance", "Attendance"];
    row.font = { bold: true };

    const columnWidths = [20, 20, 20, 30, 20, 50, 20, 20, 20];
    
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
    worksheet.mergeCells(
      `A1:${String.fromCharCode(65 + worksheet.columns.length - 1)}1`
    );

    const image = workbook.addImage({
      base64: base64_encode(path.join("public", 'logo.png')), //replace it your image (base 64 in this case)
      extension: "png",
    });

    worksheet.addImage(image, {
      tl: { col: 0, row: 0 },
      ext: { width: 60, height: 40 },
    });

    worksheet.getRow(1).height = 40;

    
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