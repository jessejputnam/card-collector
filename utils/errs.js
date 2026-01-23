exports.cardNotFound = () => new Error("Collection card not found");

exports.userNotFound = () => new Error("User not found");

exports.priceNotFound = () => new Error("Price or card type not found");

exports.noTcgPrice = () => new Error("No TCG price found");

exports.invalidUserId = () => new Error("This ain't your card, man");
