import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> createdBy", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === parent.createdBy`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      testOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            createdBy: Types.ObjectId().toString(),
            updatedBy: testUser?._id,
          },
        },
        {
          new: true,
        }
      );

      const parent = testOrganization?.toObject();

      const { createdBy: creatorResolver } = await import(
        "../../../src/resolvers/Organization/createdBy"
      );
      if (parent) {
        await creatorResolver?.(parent, {}, {});
      }
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`returns user object for parent.createdBy`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          createdBy: testUser?._id,
          updatedBy: testUser?._id,
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization?.toObject();

    const { createdBy: creatorResolver } = await import(
      "../../../src/resolvers/Organization/createdBy"
    );
    if (parent) {
      const creatorPayload = await creatorResolver?.(parent, {}, {});
      const creator = await User.findOne({
        _id: testOrganization?.createdBy,
      }).lean();

      expect(creatorPayload).toEqual(creator);
    }
  });
});
