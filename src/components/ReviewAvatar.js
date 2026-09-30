// دائرة صورة الزبونة بكرت التقييم — الصورة لو موجودة، وإلا أول حرف من اسمها
export default function ReviewAvatar({ name, image }) {
  return (
    <div
      className="review-avatar"
      style={
        image
          ? {
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!image && (name || "").charAt(0)}
    </div>
  );
}