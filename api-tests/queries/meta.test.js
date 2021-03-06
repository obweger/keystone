const { Text, Relationship } = require('@keystonejs/fields');
const { multiAdapterRunners, setupServer, graphqlRequest } = require('@keystonejs/test-utils');
const cuid = require('cuid');

function setupKeystone(adapterName) {
  return setupServer({
    adapterName,
    name: `ks5-testdb-${cuid()}`,
    createLists: keystone => {
      keystone.createList('User', {
        fields: {
          company: { type: Relationship, ref: 'Company' },
          workHistory: { type: Relationship, ref: 'Company', many: true },
        },
      });

      keystone.createList('Company', {
        fields: {
          name: { type: Text },
          employees: { type: Relationship, ref: 'User', many: true },
        },
      });

      keystone.createList('Post', {
        fields: {
          content: { type: Text },
          author: { type: Relationship, ref: 'User' },
        },
      });
    },
  });
}
multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('_FooMeta query for individual list meta data', () => {
      test(
        `'schema' field returns results`,
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
          query {
            _CompaniesMeta {
              schema {
                type
                queries
                relatedFields {
                  type
                  fields
                }
              }
            }
          }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('_CompaniesMeta.schema');
          expect(data._CompaniesMeta.schema).toMatchObject({
            type: 'Company',
            queries: ['Company', 'allCompanies', '_allCompaniesMeta'],
            relatedFields: [
              {
                type: 'User',
                fields: ['company', 'workHistory', '_workHistoryMeta'],
              },
            ],
          });
        })
      );

      test(
        `'schema.relatedFields' returns empty array when none exist`,
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
          query {
            _PostsMeta {
              schema {
                type
                queries
                relatedFields {
                  type
                  fields
                }
              }
            }
          }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('_PostsMeta.schema');
          expect(data._PostsMeta.schema).toMatchObject({
            type: 'Post',
            queries: ['Post', 'allPosts', '_allPostsMeta'],
            relatedFields: [],
          });
        })
      );
    });

    describe('_ksListsMeta query for all lists meta data', () => {
      test(
        'returns results for all lists',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
          query {
            _ksListsMeta {
              name
              schema {
                type
                queries
                fields {
                  name
                  type
                }
                relatedFields {
                  type
                  fields
                }
              }
            }
          }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('_ksListsMeta');
          expect(data._ksListsMeta).toMatchObject([
            {
              name: 'User',
              schema: {
                queries: ['User', 'allUsers', '_allUsersMeta'],
                fields: [
                  {
                    name: 'company',
                    type: 'Relationship',
                  },
                  {
                    name: 'workHistory',
                    type: 'Relationship',
                  },
                ],
                relatedFields: [
                  {
                    fields: ['employees', '_employeesMeta'],
                    type: 'Company',
                  },
                  {
                    fields: ['author'],
                    type: 'Post',
                  },
                ],
                type: 'User',
              },
            },
            {
              name: 'Company',
              schema: {
                type: 'Company',
                queries: ['Company', 'allCompanies', '_allCompaniesMeta'],
                fields: [
                  {
                    name: 'name',
                    type: 'Text',
                  },
                  {
                    name: 'employees',
                    type: 'Relationship',
                  },
                ],
                relatedFields: [
                  {
                    type: 'User',
                    fields: ['company', 'workHistory', '_workHistoryMeta'],
                  },
                ],
              },
            },
            {
              name: 'Post',
              schema: {
                queries: ['Post', 'allPosts', '_allPostsMeta'],
                fields: [
                  {
                    name: 'content',
                    type: 'Text',
                  },
                  {
                    name: 'author',
                    type: 'Relationship',
                  },
                ],
                relatedFields: [],
                type: 'Post',
              },
            },
          ]);
        })
      );

      test(
        'returns results for one list',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
          query {
            _ksListsMeta(where: { key: "User" }) {
              name
              schema {
                type
                queries
                fields {
                  name
                  type
                }
                relatedFields {
                  type
                  fields
                }
              }
            }
          }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('_ksListsMeta');
          expect(data._ksListsMeta).toMatchObject([
            {
              name: 'User',
              schema: {
                queries: ['User', 'allUsers', '_allUsersMeta'],
                fields: [
                  {
                    name: 'company',
                    type: 'Relationship',
                  },
                  {
                    name: 'workHistory',
                    type: 'Relationship',
                  },
                ],
                relatedFields: [
                  {
                    fields: ['employees', '_employeesMeta'],
                    type: 'Company',
                  },
                  {
                    fields: ['author'],
                    type: 'Post',
                  },
                ],
                type: 'User',
              },
            },
          ]);
        })
      );

      test(
        'returns results for one list and one type of fields',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
          query {
            _ksListsMeta(where: { key: "Company" }) {
              name
              schema {
                type
                queries
                fields(where: { type: "Text" }) {
                  name
                  type
                }
                relatedFields {
                  type
                  fields
                }
              }
            }
          }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('_ksListsMeta');
          expect(data._ksListsMeta).toMatchObject([
            {
              name: 'Company',
              schema: {
                type: 'Company',
                queries: ['Company', 'allCompanies', '_allCompaniesMeta'],
                fields: [
                  {
                    name: 'name',
                    type: 'Text',
                  },
                ],
                relatedFields: [
                  {
                    type: 'User',
                    fields: ['company', 'workHistory', '_workHistoryMeta'],
                  },
                ],
              },
            },
          ]);
        })
      );
    });
  })
);
