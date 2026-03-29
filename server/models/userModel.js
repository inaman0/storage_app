import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [
        3,
        "name field should a string with at least three characters",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
        "please enter a valid email",
      ],
    },
    password: {
      type: String,
      minLength: 4,
    },

    picture:{
      type: String,
      default : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALAAAACUCAMAAAAEVFNMAAAAM1BMVEX///+8vLz09PS4uLj4+Pj7+/vs7Oy1tbXv7+/p6enBwcHFxcXT09PY2NjNzc3IyMjj4+OLiLgKAAAFGklEQVR4nO2ci46kIBBFR0EFBOT/v3aRth/aKlcptJPlZjLZnWT0dE1RUA/9+ysqKioqKioqKioq+q/FayG9RM3vJomI162xqpvEwjdlTfuT4E3r9MA6Vi3F/A8H7drmbsKZWjMo9g37Qa0G095N+VTj1DbqTO4XzCz0nmmXhtbiZlypKxg3IFda3ojL7THcB/JwV9Dg5jDtxGxuQZbqJK8nVtf7BdencQOyvtjI4rx5J/WXxgvTJeJ6deYy3ER3eIrpi/aRZqDAHYmHS4g5EW7QBUtPUPJWVfalJ9CDDiiVmZjUHx7K6hUZeCuVkZhTxYeZMh6GaOLvUkzn4j17OosSZ9rzBMF+vK4uS6jgfS5efxLK4ca5HCIog1PInLwVIz/RN8Q73FKK+hyU1SEq+kiRY4tbiHbd2SO3Vkr1Q9+rY15kKXlb+Lasssa1NfeqW2eOFC4oa2+oBzNmpPCokzgX0qCVLModukaNpMUL9gVda/S3azJg8NDTyy/cgCyxPZLQxBAvs9/mnYiFxa5AxeuQ2zFdb/AGt0Au0TkiYOgvqjdxAzLkyIqGF8mT2bDL64kHxMY0x0yD2Ebs83o/RrYRkv25QXY5FzGwJ3bAZSzFEQgxjY3hjgI+OEmVAjkIrwfghYll/DqMIk4A23JsxU3E8SIBxSGziQc1FvfgAOziWSxBPZPHDcwgXk+MXCoZGEjuMY+AfIIg4Y/vy8xgvHUdXw4Eu3N8T2USBQYCTvqJDThI4MDxa/XJwPF7VC0KjGRaycDAtkEJnHwmBkIRLXBqXKuvBk5N7AQQ7CmjBEsNxC1wD4cCA7kWS61OAMCVRXc6IBe9BLhCgYFLJdd/EOAulh9NvEjPIdnCwKJDfYIjuVbyokPCWjwFDYK61MlhDdk4fLaLpEhI9k1wIIaA+/jewVuoHpNerkLuUjEgbcbqa+mHH7DyaJqYQ4AV0GRgsNTK9jN9jnbN0g/wQKr70F7qDJV9wudOT5HgDrPaJoZ5KZJQLK4Fab5egcdqrUEEaf6Roa/VngHaMQiiGAw70gNlWtafZvb/lvbA1AJJP/RQV3xs08nQpQudOnmoUUdUDDw8+KV6q41zTtv+8K9SlFuhgva3TjXTSQraUMsgjIpv/PmZsuiyo2npQ00ZZp3gayP845g+F85CHVyi2Z+4fTorxy6d/zKKvaMC65h6VAqxaEHU9ooXMId3/OWNt7Ptg3zA8P99x+NYRCeJEUH7wMrMd7hHRHtMIMx/bvajBlnrdvfE1tkWTJrHQ/yeXxA2x3fGDxiSHX0g7+2bdOMH2ybeOaJtEMsttyAdwdyq4vW4O7yJt4IO6eNrq7sdq7YnDva0bmPSIaX1MbDhDO2oVRsTj1+uLJZhawIlJi6+IzL5SO7KKONx/30Rf68J8lHGr2Nxd553JF5cjX5Y9OvQdjSeLTRPS7PMaM8HnnUSrtcsMc0y8DxL+PtU3lmoyDNS/hkp2NkA8aF35TnX0P57h45W0hA1z8+f77GIV3pH4BCjJqfI+RQuJ4kQk6YCVs5He7yNQ4Qg4X2OC2Z+pG6sUiAzVBCwzP942phDDwQr7qFmyP8AoCfGunKQxDXPCtMBX4L7N75bhEQXPjxOE9au4/XhLZ336rd5JBr5hhc2JBn5npelnE+RbsH1ak4h3/qaouPI/O5X5xxDvh03CK9e3k36UrPeA53B/oZx39pl/jnap1Yc+mdZP9VMupujqKioqKioqKioqOhm/QPPY0m2E0B/oAAAAABJRU5ErkJggg==",
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
    },
  },
  {
    strict: "throw",
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return ;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema);

export default User;
