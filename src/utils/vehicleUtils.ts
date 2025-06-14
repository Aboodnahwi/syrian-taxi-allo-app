
export function getVehicleName(type: string): string {
  switch (type) {
    case "regular":
      return "تكسي عادي";
    case "luxury":
      return "تكسي فخم";
    case "pickup":
      return "بيك أب";
    case "van":
      return "فان";
    case "motorcycle":
      return "دراجة نارية";
    default:
      return "مركبة";
  }
}

export function getVehicleIcon(type: string): string {
  switch (type) {
    case "regular":
      return "🚕";
    case "luxury":
      return "🚘";
    case "pickup":
      return "🛻";
    case "van":
      return "🚐";
    case "motorcycle":
      return "🏍️";
    default:
      return "🚗";
  }
}

export function getVehicleColor(type: string): string {
  switch (type) {
    case "regular":
      return "bg-taxi-500";
    case "luxury":
      return "bg-yellow-600";
    case "pickup":
      return "bg-blue-600";
    case "van":
      return "bg-violet-600";
    case "motorcycle":
      return "bg-gray-600";
    default:
      return "bg-gray-400";
  }
}

