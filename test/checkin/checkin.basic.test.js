import uuid from 'uuid';
import { test, Page } from 'bigtest';
import { bigtestGlobals } from '@bigtest/globals';

import {
  createCheckout,
  createInstance,
  getHoldingSources,
  getHoldingTypes,
  getInstanceTypes,
  getLoanTypes,
  getLocations,
  getMaterialTypes,
  getUsers,
  getUserServicePoints,
} from '../../api';
import {
  Authn,
  Core,
  Checkin,
} from '../../helpers';

bigtestGlobals.defaultInteractorTimeout = 10000;


const prepareCheckedOutItem = () => {
  const barcode = uuid();
  return {
    description: 'Prepare Check Out item',
    action: async () => {
      const isntanseTypes = await getInstanceTypes({ limit: 1 });
      const holdingsTypes = await getHoldingTypes({ limit: 1 });
      const locations = await getLocations({ limit: 1 });
      const holdingSources = await getHoldingSources({ limit: 1 });
      const loanTypes = await getLoanTypes({ limit: 1 });
      const materialTypes = await getMaterialTypes({ limit: 1 });
      const users = await getUsers({ limit: 1, query: '"personal.firstName"="checkout-all" and "active"="true"' });
      const userServicePoints = await getUserServicePoints(users[0].id);

      await createInstance({
        instance: {
          instanceTypeId: isntanseTypes[0].id,
          title: `Checkout instance ${new Date()}`,
        },
        holdings: [{
          holdingsTypeId: holdingsTypes[0].id,
          permanentLocationId: locations[0].id,
          sourceId: holdingSources[0].id,
        }],
        items: [
          [{
            barcode,
            missingPieces: '3',
            numberOfMissingPieces: '3',
            status: { name: 'Available' },
            permanentLoanType: { id: loanTypes[0].id },
            materialType: { id: materialTypes[0].id },
          }],
        ],
      });

      await createCheckout({
        itemBarcode: barcode,
        userBarcode: users[0].barcode,
        servicePointId: userServicePoints[0].id,
      });

      return { barcode };
    },
  };
};

export default test('Check In: basic check in')
  .step(Page.visit('/'))
  .step(Authn.login('diku_admin', 'admin'))
  .step(Core.Home().exists())
  .step(prepareCheckedOutItem())
  .step(Core.Nav().open('checkin'))
  .step('checkin item', ({ barcode }) => Checkin.checkIn(barcode).action());
