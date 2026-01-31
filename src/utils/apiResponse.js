class ApiResponse {
  constructor(statusCode, data, message = "Success"){
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400   // true if status < 400
  }
}
// Eg - res.status(200).json(new ApiResponse(200, userData, "User fetched"))
/*
  "statusCode": 200,
  "data": { "name": "Saad", "email": "..." },
  "message": "User fetched",
  "success": true
*/
export {ApiResponse}