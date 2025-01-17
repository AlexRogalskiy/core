import { escapeRegExCharacters } from '@formio/utils';
import {
  isObject,
  isObjectLike,
  isPlainObject,
  isNumber,
  isEmpty,
  isString,
  isArray
} from '@formio/lodash';

import { Rule } from './Rule';
export class UniqueRule extends Rule {
  defaultMessage = '{{ field }} must be unique';
  public async check(value: any = this.component.dataValue, options: any = {}) {
    // Skip if value is empty object or falsy
    if (!value || isObjectLike(value) && isEmpty(value)) {
      return true;
    }

    // Get the options for this check.
    const { form, submission, db } = options;

    // Skip if we don't have a database connection
    if (!db) {
      return true;
    }

    const path = `data.${this.component.path}`;

    // Build the query
    const query: any = { form: form._id };

    if (isString(value)) {
      query[path] = {
        $regex: new RegExp(`^${escapeRegExCharacters(value)}$`),
        $options: 'i'
      };
    }
    else if (
      isPlainObject(value) &&
      value.address &&
      value.address['address_components'] &&
      value.address['place_id']
    ) {
      query[`${path}.address.place_id`] = {
        $regex: new RegExp(`^${escapeRegExCharacters(value.address['place_id'])}$`),
        $options: 'i'
      };
    }
    // Compare the contents of arrays vs the order.
    else if (isArray(value)) {
      query[path] = { $all: value };
    }
    else if (isObject(value) || isNumber(value)) {
      query[path] = { $eq: value };
    }

    // Only search for non-deleted items
    query.deleted = { $eq: null };
    const result = await db.findOne(query);
    return submission._id && (result._id.toString() === submission._id);
  }
};
