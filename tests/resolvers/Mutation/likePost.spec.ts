import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  MutationLikePostArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { likePost as likePostResolver } from "../../../src/resolvers/Mutation/likePost";
import {
  POST_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import { wait } from "./acceptAdmin.spec";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testUser: TestUserType;
let testPost: TestPostType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> likePost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { likePost: likePostResolver } = await import(
        "../../../src/resolvers/Mutation/likePost"
      );

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(POST_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(POST_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`updates likedBy and likeCount fields on post object with _id === args.id and
  returns it `, async () => {
    const args: MutationLikePostArgs = {
      id: testPost?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser?._id]);
    expect(likePostPayload?.likeCount).toEqual(1);

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "Post",
    });
  });

  it(`returns post object with _id === args.id without liking the post if user with
  _id === context.userId has already liked it.`, async () => {
    const args: MutationLikePostArgs = {
      id: testPost?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser?._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });
});
