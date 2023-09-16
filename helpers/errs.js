exports.cardNotFound = () => {
  return new Error("Collection card not found");
}

exports.userNotFound = () => {
  return new Error("User not found");
}