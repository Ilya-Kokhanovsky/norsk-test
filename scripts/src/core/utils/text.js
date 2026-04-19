export function buildResultMessage(accuracyPercent, totalAnswered) {
  if (accuracyPercent === 100) {
    return { icon: "trophy", messageKey: "result.messages.perfect", barClass: "h-2 rounded-full progress-bar bg-emerald-500", iconClass: "text-emerald-600" };
  }

  if (accuracyPercent >= 90) {
    return { icon: "star", messageKey: "result.messages.excellent", barClass: "h-2 rounded-full progress-bar bg-emerald-500", iconClass: "text-emerald-600" };
  }

  if (accuracyPercent >= 75) {
    return { icon: "award", messageKey: "result.messages.good", barClass: "h-2 rounded-full progress-bar bg-emerald-500", iconClass: "text-emerald-600" };
  }

  if (accuracyPercent >= 50) {
    return { icon: "target", messageKey: "result.messages.average", barClass: "h-2 rounded-full progress-bar bg-amber-400", iconClass: "text-amber-500" };
  }

  if (totalAnswered === 0) {
    return { icon: "circle-help", messageKey: "result.messages.empty", barClass: "h-2 rounded-full progress-bar bg-gray-300", iconClass: "text-gray-400" };
  }

  return { icon: "book-open", messageKey: "result.messages.retry", barClass: "h-2 rounded-full progress-bar bg-red-400", iconClass: "text-red-500" };
}
