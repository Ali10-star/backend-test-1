import Joi from 'joi';

const specialChars = new RegExp(/^.*[<>{}].*$/s);

export default Joi.object({
  id: Joi.string().optional(),
  title: Joi.string()
    .min(5)
    .max(50)
    .required()
    .custom((value, helpers) =>
      (specialChars.test(value) ? helpers.error('any.invalid') : value)
    ).messages({
      'any.invalid': "Post title cannot contain special characters"
    }),
  description: Joi.string().max(500).required(),
  image: Joi.string().required(),
}).unknown(false);
