import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This resolver function will fetch and return the latest updator of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the updator data. If the creator not exists then throws an `NotFoundError` error.
 */
export const updatedBy: OrganizationResolvers["updatedBy"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.updatedBy,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return user;
};
