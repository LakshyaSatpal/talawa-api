import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for an event project in the database(MongoDB).
 */
export interface InterfaceEventProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  event: PopulatedDoc<InterfaceEvent & Document>;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This is the Structure of the event project
 * @param title - Title
 * @param description - description
 * @param createdAt - Created at Date
 * @param event - Event
 * @param creator - Creator
 * @param tasks - Tasks
 * @param status - Status
 */
const eventProjectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

eventProjectSchema.pre<InterfaceEventProject>("save", function (next) {
  if (!this.updatedBy) {
    this.updatedBy = this.createdBy;
  }
  next();
});

const eventProjectModel = (): Model<InterfaceEventProject> =>
  model<InterfaceEventProject>("EventProject", eventProjectSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventProject = (models.EventProject ||
  eventProjectModel()) as ReturnType<typeof eventProjectModel>;
