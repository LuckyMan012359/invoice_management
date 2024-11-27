export function validateFormField(value, type) {
    if (!value) {
      if (type === "radio") return "Please select one of this radio";
      return "Please input value";
    }
    if (type === "password") {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumberOrSymbol = /[\d\W]/.test(value);
      if (value.length < 8) {
        return "The password must be at least 8 characters.";
      }
      if (hasUpperCase && hasNumberOrSymbol) return "";
      return "The password must includes at least a Number and an Uppercase";
    } else if (type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Input correct Email.";
      }
    } else if (type === "fullname") {
      const fullname = value.split(" ");
      if (fullname.length !== 2)
        return "The fullname should combination of first name and last name";
    } else if (type === "bLink") {
      if (!/^(ftp|http|https):\/\/[^ "]+$/.test(value))
        return "This is not valid link.";
    } else if (type === "description") {
      if (value.length < 10) return "Please enter at least 10 characters.";
    }
    return "";
  }
  